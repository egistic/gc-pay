# app/core/monitoring.py
import time
import logging
import psutil
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from contextlib import asynccontextmanager
from fastapi import Request, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.db import get_db
from app.core.config import settings

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('logs/app.log', mode='a')
    ]
)

logger = logging.getLogger(__name__)

class PerformanceMetrics:
    """Collect and track performance metrics for the application."""
    
    def __init__(self):
        self.request_count = 0
        self.error_count = 0
        self.response_times = []
        self.start_time = datetime.utcnow()
        self.db_connection_count = 0
        self.db_query_count = 0
        self.cache_hits = 0
        self.cache_misses = 0
    
    def record_request(self, response_time: float, status_code: int):
        """Record a request and its performance metrics."""
        self.request_count += 1
        self.response_times.append(response_time)
        
        if status_code >= 400:
            self.error_count += 1
        
        # Keep only last 1000 response times for rolling average
        if len(self.response_times) > 1000:
            self.response_times = self.response_times[-1000:]
    
    def record_db_operation(self, query_time: float):
        """Record a database operation."""
        self.db_query_count += 1
    
    def record_cache_operation(self, hit: bool):
        """Record a cache operation."""
        if hit:
            self.cache_hits += 1
        else:
            self.cache_misses += 1
    
    def get_metrics(self) -> Dict[str, Any]:
        """Get current performance metrics."""
        uptime = (datetime.utcnow() - self.start_time).total_seconds()
        avg_response_time = sum(self.response_times) / len(self.response_times) if self.response_times else 0
        error_rate = (self.error_count / self.request_count * 100) if self.request_count > 0 else 0
        
        return {
            "uptime_seconds": uptime,
            "request_count": self.request_count,
            "error_count": self.error_count,
            "error_rate_percent": round(error_rate, 2),
            "avg_response_time_ms": round(avg_response_time * 1000, 2),
            "db_query_count": self.db_query_count,
            "cache_hits": self.cache_hits,
            "cache_misses": self.cache_misses,
            "cache_hit_rate": round(self.cache_hits / (self.cache_hits + self.cache_misses) * 100, 2) if (self.cache_hits + self.cache_misses) > 0 else 0
        }

class SystemMetrics:
    """Collect system-level metrics."""
    
    @staticmethod
    def get_system_metrics() -> Dict[str, Any]:
        """Get current system metrics."""
        try:
            # CPU metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            cpu_count = psutil.cpu_count()
            
            # Memory metrics
            memory = psutil.virtual_memory()
            memory_percent = memory.percent
            memory_available_gb = memory.available / (1024**3)
            memory_total_gb = memory.total / (1024**3)
            
            # Disk metrics
            disk = psutil.disk_usage('/')
            disk_percent = disk.percent
            disk_free_gb = disk.free / (1024**3)
            disk_total_gb = disk.total / (1024**3)
            
            return {
                "cpu": {
                    "percent": cpu_percent,
                    "count": cpu_count
                },
                "memory": {
                    "percent": memory_percent,
                    "available_gb": round(memory_available_gb, 2),
                    "total_gb": round(memory_total_gb, 2)
                },
                "disk": {
                    "percent": disk_percent,
                    "free_gb": round(disk_free_gb, 2),
                    "total_gb": round(disk_total_gb, 2)
                },
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
            return {"error": str(e), "timestamp": datetime.utcnow().isoformat()}

class DatabaseMetrics:
    """Collect database-specific metrics."""
    
    @staticmethod
    def get_database_metrics(db: Session) -> Dict[str, Any]:
        """Get database performance metrics."""
        try:
            # Get connection pool stats
            pool = db.bind.pool
            pool_size = pool.size()
            checked_out = pool.checkedout()
            overflow = pool.overflow()
            
            # Get database size
            size_query = text("""
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """)
            size_result = db.execute(size_query).fetchone()
            db_size = size_result[0] if size_result else "Unknown"
            
            # Get table counts
            table_counts = {}
            tables = ['payment_requests', 'users', 'idempotency_keys', 'payment_priority_rules']
            for table in tables:
                try:
                    count_query = text(f"SELECT COUNT(*) FROM {table}")
                    count_result = db.execute(count_query).fetchone()
                    table_counts[table] = count_result[0] if count_result else 0
                except Exception:
                    table_counts[table] = 0
            
            # Get active connections
            conn_query = text("""
                SELECT COUNT(*) FROM pg_stat_activity 
                WHERE state = 'active'
            """)
            conn_result = db.execute(conn_query).fetchone()
            active_connections = conn_result[0] if conn_result else 0
            
            return {
                "connection_pool": {
                    "size": pool_size,
                    "checked_out": checked_out,
                    "overflow": overflow
                },
                "database_size": db_size,
                "table_counts": table_counts,
                "active_connections": active_connections,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"Failed to collect database metrics: {e}")
            return {"error": str(e), "timestamp": datetime.utcnow().isoformat()}

class AlertingSystem:
    """Simple alerting system for monitoring thresholds."""
    
    def __init__(self):
        self.alerts = []
        self.thresholds = {
            "error_rate": 5.0,  # 5% error rate
            "response_time": 2.0,  # 2 seconds
            "cpu_percent": 80.0,  # 80% CPU usage
            "memory_percent": 85.0,  # 85% memory usage
            "disk_percent": 90.0  # 90% disk usage
        }
    
    def check_thresholds(self, performance_metrics: PerformanceMetrics, system_metrics: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check if any metrics exceed thresholds and generate alerts."""
        alerts = []
        current_time = datetime.utcnow()
        
        # Check error rate
        if performance_metrics.error_count > 0:
            error_rate = (performance_metrics.error_count / performance_metrics.request_count * 100)
            if error_rate > self.thresholds["error_rate"]:
                alerts.append({
                    "type": "error_rate",
                    "severity": "high",
                    "message": f"Error rate {error_rate:.2f}% exceeds threshold {self.thresholds['error_rate']}%",
                    "timestamp": current_time.isoformat(),
                    "value": error_rate,
                    "threshold": self.thresholds["error_rate"]
                })
        
        # Check response time
        if performance_metrics.response_times:
            avg_response_time = sum(performance_metrics.response_times) / len(performance_metrics.response_times)
            if avg_response_time > self.thresholds["response_time"]:
                alerts.append({
                    "type": "response_time",
                    "severity": "medium",
                    "message": f"Average response time {avg_response_time:.2f}s exceeds threshold {self.thresholds['response_time']}s",
                    "timestamp": current_time.isoformat(),
                    "value": avg_response_time,
                    "threshold": self.thresholds["response_time"]
                })
        
        # Check system metrics
        if "cpu" in system_metrics:
            cpu_percent = system_metrics["cpu"]["percent"]
            if cpu_percent > self.thresholds["cpu_percent"]:
                alerts.append({
                    "type": "cpu_usage",
                    "severity": "medium",
                    "message": f"CPU usage {cpu_percent}% exceeds threshold {self.thresholds['cpu_percent']}%",
                    "timestamp": current_time.isoformat(),
                    "value": cpu_percent,
                    "threshold": self.thresholds["cpu_percent"]
                })
        
        if "memory" in system_metrics:
            memory_percent = system_metrics["memory"]["percent"]
            if memory_percent > self.thresholds["memory_percent"]:
                alerts.append({
                    "type": "memory_usage",
                    "severity": "high",
                    "message": f"Memory usage {memory_percent}% exceeds threshold {self.thresholds['memory_percent']}%",
                    "timestamp": current_time.isoformat(),
                    "value": memory_percent,
                    "threshold": self.thresholds["memory_percent"]
                })
        
        if "disk" in system_metrics:
            disk_percent = system_metrics["disk"]["percent"]
            if disk_percent > self.thresholds["disk_percent"]:
                alerts.append({
                    "type": "disk_usage",
                    "severity": "high",
                    "message": f"Disk usage {disk_percent}% exceeds threshold {self.thresholds['disk_percent']}%",
                    "timestamp": current_time.isoformat(),
                    "value": disk_percent,
                    "threshold": self.thresholds["disk_percent"]
                })
        
        # Store alerts
        self.alerts.extend(alerts)
        
        # Keep only last 100 alerts
        if len(self.alerts) > 100:
            self.alerts = self.alerts[-100:]
        
        return alerts
    
    def get_recent_alerts(self, hours: int = 24) -> List[Dict[str, Any]]:
        """Get alerts from the last N hours."""
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        return [alert for alert in self.alerts if datetime.fromisoformat(alert["timestamp"]) > cutoff_time]

# Global instances
performance_metrics = PerformanceMetrics()
alerting_system = AlertingSystem()

def get_performance_metrics() -> PerformanceMetrics:
    """Get the global performance metrics instance."""
    return performance_metrics

def get_alerting_system() -> AlertingSystem:
    """Get the global alerting system instance."""
    return alerting_system

# Middleware for request monitoring
async def monitoring_middleware(request: Request, call_next):
    """Middleware to monitor request performance and collect metrics."""
    start_time = time.perf_counter()
    
    # Log request
    logger.info(f"Request started: {request.method} {request.url.path}")
    
    try:
        response = await call_next(request)
        
        # Calculate response time
        response_time = time.perf_counter() - start_time
        
        # Record metrics
        performance_metrics.record_request(response_time, response.status_code)
        
        # Add performance headers
        response.headers["X-Response-Time"] = str(response_time)
        response.headers["X-Request-Count"] = str(performance_metrics.request_count)
        
        # Log response
        logger.info(f"Request completed: {request.method} {request.url.path} - {response.status_code} - {response_time:.3f}s")
        
        return response
        
    except Exception as e:
        # Record error
        response_time = time.perf_counter() - start_time
        performance_metrics.record_request(response_time, 500)
        
        # Log error
        logger.error(f"Request failed: {request.method} {request.url.path} - {str(e)}")
        
        raise

# Health check functions
async def health_check() -> Dict[str, Any]:
    """Comprehensive health check for the application."""
    health_status = {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "checks": {}
    }
    
    # Check application metrics
    try:
        metrics = performance_metrics.get_metrics()
        health_status["checks"]["performance"] = {
            "status": "healthy",
            "uptime_seconds": metrics["uptime_seconds"],
            "request_count": metrics["request_count"],
            "error_rate_percent": metrics["error_rate_percent"]
        }
    except Exception as e:
        health_status["checks"]["performance"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check system metrics
    try:
        system_metrics = SystemMetrics.get_system_metrics()
        health_status["checks"]["system"] = {
            "status": "healthy",
            "cpu_percent": system_metrics.get("cpu", {}).get("percent", 0),
            "memory_percent": system_metrics.get("memory", {}).get("percent", 0),
            "disk_percent": system_metrics.get("disk", {}).get("percent", 0)
        }
    except Exception as e:
        health_status["checks"]["system"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Check database
    try:
        db = next(get_db())
        db_metrics = DatabaseMetrics.get_database_metrics(db)
        health_status["checks"]["database"] = {
            "status": "healthy",
            "active_connections": db_metrics.get("active_connections", 0),
            "database_size": db_metrics.get("database_size", "Unknown")
        }
    except Exception as e:
        health_status["checks"]["database"] = {
            "status": "unhealthy",
            "error": str(e)
        }
    
    # Overall status
    all_healthy = all(check.get("status") == "healthy" for check in health_status["checks"].values())
    health_status["status"] = "healthy" if all_healthy else "unhealthy"
    
    return health_status
