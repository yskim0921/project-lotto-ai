import sys
import json

try:
    gender = sys.argv[1]
    calendar = sys.argv[2]
    year = int(sys.argv[3])
    month = int(sys.argv[4])
    day = int(sys.argv[5])
    dream = sys.argv[6]

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)

# 예시 계산
result = [gender, calendar, year, month, day]
result2 = dream

print(json.dumps({
    "result": result,
    "result2": result2
}))
