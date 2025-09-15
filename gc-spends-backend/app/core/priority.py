# app/core/priority.py
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import PaymentRequest, PaymentPriorityRule, PaymentPriority
from app.common.enums import PaymentPriority as PriorityEnum

class PriorityCalculationService:
    """
    Service for calculating payment request priorities based on rules and conditions.
    """
    
    def __init__(self, db: Session):
        self.db = db
    
    def calculate_priority(self, payment_request: PaymentRequest) -> tuple[PriorityEnum, float]:
        """
        Calculate priority and score for a payment request based on active rules.
        
        Returns:
            tuple: (priority_enum, score)
        """
        # Get all active priority rules
        rules = self.db.query(PaymentPriorityRule).filter(
            PaymentPriorityRule.is_active == True
        ).all()
        
        if not rules:
            return PriorityEnum.NORMAL, 0.0
        
        # Calculate base score
        base_score = 0.0
        matched_rules = []
        
        for rule in rules:
            score = self._evaluate_rule(rule, payment_request)
            if score > 0:
                base_score += score
                matched_rules.append(rule)
        
        # Determine priority based on score
        priority = self._score_to_priority(base_score)
        
        return priority, base_score
    
    def _evaluate_rule(self, rule: PaymentPriorityRule, payment_request: PaymentRequest) -> float:
        """
        Evaluate a single priority rule against a payment request.
        
        Returns:
            float: Score contribution from this rule
        """
        conditions = rule.conditions
        if not conditions:
            return 0.0
        
        score = 0.0
        
        # Amount-based scoring
        if 'amount_thresholds' in conditions:
            thresholds = conditions['amount_thresholds']
            amount = float(payment_request.amount_total)
            
            for threshold in thresholds:
                if amount >= threshold['min'] and amount < threshold['max']:
                    score += threshold['score']
                    break
        
        # Due date urgency scoring
        if 'due_date_urgency' in conditions:
            urgency_config = conditions['due_date_urgency']
            days_until_due = (payment_request.due_date - datetime.now().date()).days
            
            if days_until_due <= urgency_config.get('critical_days', 1):
                score += urgency_config.get('critical_score', 10.0)
            elif days_until_due <= urgency_config.get('urgent_days', 3):
                score += urgency_config.get('urgent_score', 5.0)
            elif days_until_due <= urgency_config.get('high_days', 7):
                score += urgency_config.get('high_score', 2.0)
        
        # Currency-based scoring
        if 'currency_priority' in conditions:
            currency_config = conditions['currency_priority']
            if payment_request.currency_code in currency_config.get('high_priority_currencies', []):
                score += currency_config.get('high_priority_score', 3.0)
        
        # Counterparty-based scoring
        if 'counterparty_priority' in conditions:
            counterparty_config = conditions['counterparty_priority']
            if payment_request.counterparty_id in counterparty_config.get('high_priority_counterparties', []):
                score += counterparty_config.get('high_priority_score', 2.0)
        
        # Status-based scoring
        if 'status_priority' in conditions:
            status_config = conditions['status_priority']
            status_scores = status_config.get('status_scores', {})
            score += status_scores.get(payment_request.status.value, 0.0)
        
        # Time-based scoring (time of day, day of week)
        if 'time_based' in conditions:
            time_config = conditions['time_based']
            now = datetime.now()
            
            # Business hours scoring
            if time_config.get('business_hours_priority', False):
                if 9 <= now.hour <= 17 and now.weekday() < 5:  # Business hours
                    score += time_config.get('business_hours_score', 1.0)
            
            # Weekend/after hours scoring
            if time_config.get('after_hours_priority', False):
                if now.hour < 9 or now.hour > 17 or now.weekday() >= 5:
                    score += time_config.get('after_hours_score', 2.0)
        
        return score
    
    def _score_to_priority(self, score: float) -> PriorityEnum:
        """
        Convert calculated score to priority enum.
        """
        if score >= 20.0:
            return PriorityEnum.CRITICAL
        elif score >= 15.0:
            return PriorityEnum.URGENT
        elif score >= 10.0:
            return PriorityEnum.HIGH
        elif score >= 5.0:
            return PriorityEnum.NORMAL
        else:
            return PriorityEnum.LOW
    
    def get_priority_escalation_rules(self) -> List[Dict[str, Any]]:
        """
        Get priority escalation rules for monitoring and alerting.
        """
        return [
            {
                "priority": PriorityEnum.CRITICAL,
                "escalation_time_minutes": 15,
                "notification_channels": ["email", "sms", "slack"]
            },
            {
                "priority": PriorityEnum.URGENT,
                "escalation_time_minutes": 60,
                "notification_channels": ["email", "slack"]
            },
            {
                "priority": PriorityEnum.HIGH,
                "escalation_time_minutes": 240,
                "notification_channels": ["email"]
            },
            {
                "priority": PriorityEnum.NORMAL,
                "escalation_time_minutes": 1440,  # 24 hours
                "notification_channels": ["email"]
            },
            {
                "priority": PriorityEnum.LOW,
                "escalation_time_minutes": 4320,  # 72 hours
                "notification_channels": []
            }
        ]
    
    def should_escalate(self, payment_request: PaymentRequest) -> bool:
        """
        Check if a payment request should be escalated based on priority and time.
        """
        if not payment_request.priority:
            return False
        
        escalation_rules = self.get_priority_escalation_rules()
        
        for rule in escalation_rules:
            if rule["priority"] == payment_request.priority:
                time_since_created = datetime.now() - payment_request.created_at
                escalation_time = timedelta(minutes=rule["escalation_time_minutes"])
                
                return time_since_created >= escalation_time
        
        return False
    
    def get_priority_statistics(self) -> Dict[str, Any]:
        """
        Get statistics about payment request priorities.
        """
        stats = {}
        
        for priority in PriorityEnum:
            count = self.db.query(PaymentRequest).filter(
                PaymentRequest.priority == priority,
                PaymentRequest.deleted == False
            ).count()
            
            stats[priority.value] = {
                "count": count,
                "percentage": 0  # Will be calculated after getting all counts
            }
        
        total = sum(stat["count"] for stat in stats.values())
        
        if total > 0:
            for priority in stats:
                stats[priority]["percentage"] = round(
                    (stats[priority]["count"] / total) * 100, 2
                )
        
        return stats

def create_default_priority_rules(db: Session) -> None:
    """
    Create default priority rules for the system.
    """
    default_rules = [
        {
            "name": "High Amount Priority",
            "description": "High priority for large payment amounts",
            "priority": PriorityEnum.HIGH,
            "conditions": {
                "amount_thresholds": [
                    {"min": 100000, "max": 500000, "score": 5.0},
                    {"min": 500000, "max": 1000000, "score": 10.0},
                    {"min": 1000000, "max": float('inf'), "score": 15.0}
                ]
            }
        },
        {
            "name": "Due Date Urgency",
            "description": "Priority based on due date urgency",
            "priority": PriorityEnum.URGENT,
            "conditions": {
                "due_date_urgency": {
                    "critical_days": 1,
                    "critical_score": 15.0,
                    "urgent_days": 3,
                    "urgent_score": 10.0,
                    "high_days": 7,
                    "high_score": 5.0
                }
            }
        },
        {
            "name": "Critical Status Priority",
            "description": "High priority for critical statuses",
            "priority": PriorityEnum.CRITICAL,
            "conditions": {
                "status_priority": {
                    "status_scores": {
                        "submitted": 2.0,
                        "under_review": 3.0,
                        "approved": 5.0
                    }
                }
            }
        },
        {
            "name": "Business Hours Priority",
            "description": "Priority adjustment based on business hours",
            "priority": PriorityEnum.NORMAL,
            "conditions": {
                "time_based": {
                    "business_hours_priority": True,
                    "business_hours_score": 1.0,
                    "after_hours_priority": True,
                    "after_hours_score": 2.0
                }
            }
        }
    ]
    
    # Create rules if they don't exist
    for rule_data in default_rules:
        existing_rule = db.query(PaymentPriorityRule).filter(
            PaymentPriorityRule.name == rule_data["name"]
        ).first()
        
        if not existing_rule:
            rule = PaymentPriorityRule(
                name=rule_data["name"],
                description=rule_data["description"],
                priority=rule_data["priority"],
                conditions=rule_data["conditions"],
                created_by=db.query(db.query().first()).first().id if db.query().first() else None
            )
            db.add(rule)
    
    db.commit()
