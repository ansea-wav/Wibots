import json

transcript_path = r"C:\Users\Satria\.gemini\antigravity\brain\c3e785f6-7614-497b-afe1-ba2085a974bf\.system_generated\logs\transcript_full.jsonl"
out_path = r"e:\Private Project Database NetalsStore\Bot Wa\Data baru (master)\extract2.txt"

route_code = ""

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        try:
            data = json.loads(line)
            if "tool_calls" in data:
                for tool_call in data["tool_calls"]:
                    args = str(tool_call.get("args", {}))
                    if "/api/auth/verify-otp" in args and "index.js" in args:
                        route_code += "\n\n--- TOOL CALL ---\n" + args
        except:
            pass

with open(out_path, 'w', encoding='utf-8') as f:
    f.write(route_code)
