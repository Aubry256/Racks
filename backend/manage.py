#!/usr/bin/env python
"""
manage.py — Django's command-line utility

This file is the entry point for all Django commands:

  python manage.py runserver          → start development server
  python manage.py makemigrations     → detect model changes
  python manage.py migrate            → apply changes to database
  python manage.py createsuperuser    → create admin user
  python manage.py seed_data          → add demo products (our custom command)
  python manage.py shell              → interactive Python with Django loaded
"""
import os
import sys

def main():
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'racks_api.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Django not found. Make sure you activated the virtual environment:\n"
            "  Windows: venv\\Scripts\\activate\n"
            "  Mac/Linux: source venv/bin/activate"
        ) from exc
    execute_from_command_line(sys.argv)

if __name__ == '__main__':
    main()
