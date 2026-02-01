"""
Custom exceptions for the chatbot application
"""

class ChatbotException(Exception):
    """Base exception for chatbot"""
    pass

class DatabaseException(ChatbotException):
    """Database related exceptions"""
    pass

class ModelException(ChatbotException):
    """Model related exceptions"""
    pass

class ValidationException(ChatbotException):
    """Validation related exceptions"""
    pass

class RateLimitException(ChatbotException):
    """Rate limit exceeded exception"""
    pass
