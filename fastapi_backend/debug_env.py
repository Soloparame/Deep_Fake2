"""
Debug script to check .env file format without exposing passwords.
Run: python debug_env.py
"""

import os
from pathlib import Path

# Find .env file
base_dir = Path(__file__).parent
env_path = base_dir / ".env"

print("=" * 60)
print("Debugging .env File Format")
print("=" * 60)
print()
print(f"Reading from: {env_path}")
print()

if not env_path.exists():
    print("ERROR: .env file not found!")
    exit(1)

# Read the file
with open(env_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines in file: {len(lines)}")
print()

# Check for email-related variables
email_vars = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_FROM', 'FRONTEND_URL']
found_vars = {}

for i, line in enumerate(lines, 1):
    line = line.strip()
    
    # Skip empty lines and comments
    if not line or line.startswith('#'):
        continue
    
    # Check each email variable
    for var in email_vars:
        if var in line:
            found_vars[var] = {
                'line_num': i,
                'raw': line,
                'has_equals': '=' in line,
                'has_spaces_around_equals': ' = ' in line or '= ' in line or ' =' in line,
                'has_quotes': line.count('"') > 0 or line.count("'") > 0,
            }

print("Email-related variables found:")
print("-" * 60)

for var in email_vars:
    if var in found_vars:
        info = found_vars[var]
        print(f"\nFOUND: {var} (line {info['line_num']}):")
        print(f"   Raw line: {info['raw']}")
        
        # Check for issues
        issues = []
        if not info['has_equals']:
            issues.append("ERROR: Missing '=' sign")
        if info['has_spaces_around_equals']:
            issues.append("WARNING: Has spaces around '=' (should be VAR=value, not VAR = value)")
        if info['has_quotes']:
            issues.append("WARNING: Has quotes (usually not needed)")
        
        if issues:
            print("   Issues:")
            for issue in issues:
                print(f"      {issue}")
        else:
            print("   OK Format looks correct")
        
        # Try to parse the value
        if '=' in info['raw']:
            parts = info['raw'].split('=', 1)
            if len(parts) == 2:
                var_name = parts[0].strip()
                var_value = parts[1].strip().strip('"').strip("'")
                if var == 'SMTP_PASSWORD':
                    print(f"   Value: {'SET (' + str(len(var_value)) + ' chars)' if var_value else 'EMPTY'}")
                else:
                    print(f"   Value: {var_value if var_value else 'EMPTY'}")
    else:
        print(f"\nNOT FOUND: {var}")

print()
print("=" * 60)
print()
print("Common Issues:")
print("  1. Spaces around = sign: Use SMTP_USER=email, not SMTP_USER = email")
print("  2. Quotes: Usually not needed, use SMTP_USER=email, not SMTP_USER='email'")
print("  3. Wrong variable name: Must be exactly SMTP_USER, SMTP_PASSWORD (case-sensitive)")
print("  4. Empty values: Make sure there's a value after the = sign")
print()

