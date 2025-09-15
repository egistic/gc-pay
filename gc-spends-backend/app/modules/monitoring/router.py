# app/modules/monitoring/router.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from app.core.db import get_db
from app.core.monitoring import (
    get_performance_metrics, 
    get_alerting_system, 
    SystemMetrics, 
    DatabaseMetrics,
    health_check
)
from app.core.security import get_current_user
from app.models import User

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

@router.get("/health")
async def get_health_status():
    """
    Get comprehensive health status of the application.
    
    Returns detailed health information including:
    - Application performance metrics
    - System resource usage
    - Database connectivity and performance
    - Overall health status
    """
    return await health_check()

@router.get("/metrics/performance")
async def get_performance_metrics_endpoint():
    """
    Get current performance metrics for the application.
    
    Returns metrics including:
    - Request count and error rate
    - Average response time
    - Database query statistics
    - Cache hit rates
    - Uptime information
    """
    metrics = get_performance_metrics()
    return metrics.get_metrics()

@router.get("/metrics/system")
async def get_system_metrics_endpoint():
    """
    Get current system resource metrics.
    
    Returns metrics including:
    - CPU usage and core count
    - Memory usage and availability
    - Disk usage and free space
    - System timestamp
    """
    return SystemMetrics.get_system_metrics()

@router.get("/metrics/database")
async def get_database_metrics_endpoint(
    db: Session = Depends(get_db)
):
    """
    Get current database performance metrics.
    
    Returns metrics including:
    - Connection pool statistics
    - Database size
    - Table row counts
    - Active connections
    """
    return DatabaseMetrics.get_database_metrics(db)

@router.get("/metrics/combined")
async def get_combined_metrics_endpoint(
    db: Session = Depends(get_db)
):
    """
    Get all metrics combined in a single response.
    
    Returns a comprehensive view of:
    - Application performance
    - System resources
    - Database performance
    - Alert status
    """
    performance_metrics = get_performance_metrics()
    system_metrics = SystemMetrics.get_system_metrics()
    database_metrics = DatabaseMetrics.get_database_metrics(db)
    alerting_system = get_alerting_system()
    
    # Check for alerts
    alerts = alerting_system.check_thresholds(performance_metrics, system_metrics)
    
    return {
        "timestamp": datetime.utcnow().isoformat(),
        "performance": performance_metrics.get_metrics(),
        "system": system_metrics,
        "database": database_metrics,
        "alerts": alerts,
        "alert_count": len(alerts)
    }

@router.get("/alerts")
async def get_alerts(
    hours: int = Query(24, ge=1, le=168, description="Number of hours to look back for alerts"),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent alerts from the monitoring system.
    
    - **hours**: Number of hours to look back for alerts (1-168)
    """
    alerting_system = get_alerting_system()
    alerts = alerting_system.get_recent_alerts(hours)
    
    return {
        "alerts": alerts,
        "count": len(alerts),
        "hours_looked_back": hours,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/alerts/active")
async def get_active_alerts(
    current_user: User = Depends(get_current_user)
):
    """
    Get currently active alerts (from the last hour).
    """
    alerting_system = get_alerting_system()
    alerts = alerting_system.get_recent_alerts(1)
    
    # Filter for high severity alerts
    active_alerts = [alert for alert in alerts if alert.get("severity") in ["high", "critical"]]
    
    return {
        "active_alerts": active_alerts,
        "count": len(active_alerts),
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/alerts/summary")
async def get_alerts_summary(
    current_user: User = Depends(get_current_user)
):
    """
    Get summary of alerts by severity and type.
    """
    alerting_system = get_alerting_system()
    alerts = alerting_system.get_recent_alerts(24)
    
    # Group alerts by severity
    severity_counts = {}
    type_counts = {}
    
    for alert in alerts:
        severity = alert.get("severity", "unknown")
        alert_type = alert.get("type", "unknown")
        
        severity_counts[severity] = severity_counts.get(severity, 0) + 1
        type_counts[alert_type] = type_counts.get(alert_type, 0) + 1
    
    return {
        "summary": {
            "total_alerts": len(alerts),
            "by_severity": severity_counts,
            "by_type": type_counts
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@router.post("/alerts/test")
async def test_alerting_system(
    current_user: User = Depends(get_current_user)
):
    """
    Test the alerting system by generating a test alert.
    """
    alerting_system = get_alerting_system()
    
    # Create a test alert
    test_alert = {
        "type": "test",
        "severity": "low",
        "message": "Test alert generated by monitoring system",
        "timestamp": datetime.utcnow().isoformat(),
        "value": 0,
        "threshold": 0
    }
    
    alerting_system.alerts.append(test_alert)
    
    return {
        "message": "Test alert generated successfully",
        "alert": test_alert,
        "timestamp": datetime.utcnow().isoformat()
    }

@router.get("/status")
async def get_system_status():
    """
    Get overall system status and health indicators.
    """
    try:
        # Get basic health check
        health_data = await health_check()
        
        # Get performance metrics
        performance_metrics = get_performance_metrics()
        perf_data = performance_metrics.get_metrics()
        
        # Get system metrics
        system_data = SystemMetrics.get_system_metrics()
        
        # Determine overall status
        overall_status = "healthy"
        if health_data["status"] != "healthy":
            overall_status = "unhealthy"
        elif perf_data["error_rate_percent"] > 5:
            overall_status = "degraded"
        elif system_data.get("cpu", {}).get("percent", 0) > 80:
            overall_status = "degraded"
        elif system_data.get("memory", {}).get("percent", 0) > 85:
            overall_status = "degraded"
        
        return {
            "status": overall_status,
            "timestamp": datetime.utcnow().isoformat(),
            "health": health_data,
            "performance": perf_data,
            "system": system_data
        }
        
    except Exception as e:
        return {
            "status": "error",
            "timestamp": datetime.utcnow().isoformat(),
            "error": str(e)
        }

@router.get("/logs")
async def get_recent_logs(
    lines: int = Query(100, ge=1, le=1000, description="Number of log lines to return"),
    level: Optional[str] = Query(None, description="Filter by log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get recent application logs.
    
    - **lines**: Number of log lines to return (1-1000)
    - **level**: Filter by log level
    """
    try:
        # This is a simplified implementation
        # In production, you would integrate with a proper logging system
        # like ELK stack, Fluentd, or similar
        
        log_entries = []
        
        # For demonstration, return a sample log entry
        log_entries.append({
            "timestamp": datetime.utcnow().isoformat(),
            "level": "INFO",
            "message": "Sample log entry for monitoring",
            "module": "monitoring.router"
        })
        
        return {
            "logs": log_entries,
            "count": len(log_entries),
            "lines_requested": lines,
            "level_filter": level,
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve logs: {str(e)}")

@router.get("/dashboard")
async def get_monitoring_dashboard(
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive monitoring dashboard data.
    
    Returns all monitoring data needed for a dashboard view.
    """
    try:
        # Get all metrics
        performance_metrics = get_performance_metrics()
        system_metrics = SystemMetrics.get_system_metrics()
        alerting_system = get_alerting_system()
        
        # Get recent alerts
        recent_alerts = alerting_system.get_recent_alerts(24)
        
        # Calculate alert summary
        alert_summary = {}
        for alert in recent_alerts:
            severity = alert.get("severity", "unknown")
            alert_summary[severity] = alert_summary.get(severity, 0) + 1
        
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "performance": performance_metrics.get_metrics(),
            "system": system_metrics,
            "alerts": {
                "recent": recent_alerts[-10:],  # Last 10 alerts
                "summary": alert_summary,
                "total_count": len(recent_alerts)
            },
            "status": {
                "overall": "healthy" if len(recent_alerts) == 0 else "attention_needed",
                "performance": "good" if performance_metrics.get_metrics()["error_rate_percent"] < 1 else "degraded",
                "system": "good" if system_metrics.get("cpu", {}).get("percent", 0) < 70 else "degraded"
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate dashboard data: {str(e)}")
