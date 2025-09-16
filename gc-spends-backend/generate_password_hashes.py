#!/usr/bin/env python3
"""
Скрипт для генерации хешей паролей для пользователей
Используйте этот скрипт для создания правильных хешей паролей
"""

from passlib.context import CryptContext

# Создаем контекст для хеширования паролей (как в приложении)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def generate_password_hash(password: str) -> str:
    """Генерирует хеш пароля используя bcrypt"""
    return pwd_context.hash(password)

if __name__ == "__main__":
    # Пароли для пользователей (измените на нужные)
    passwords = {
        "admin": "password123",
        "executor": "password123", 
        "registrar": "password123",
        "sub_registrar": "password123",
        "distributor": "password123",
        "treasurer": "password123"
    }
    
    print("Генерируем хеши паролей:")
    print("=" * 50)
    
    for user_type, password in passwords.items():
        password_hash = generate_password_hash(password)
        print(f"{user_type}: {password}")
        print(f"Hash: {password_hash}")
        print("-" * 30)
    
    print("\nSQL команды для обновления паролей:")
    print("=" * 50)
    
    for user_type, password in passwords.items():
        password_hash = generate_password_hash(password)
        email = f"{user_type}@company.com"
        print(f"UPDATE users SET password_hash = '{password_hash}' WHERE email = '{email}';")
