#!/bin/bash
# 在服务器 /opt/couple-app 下执行：从微信拉取已添加的个人模板 ID 写入 .env
# 前提：已在 mp.weixin.qq.com → 订阅消息 中手动添加模板
set -euo pipefail
cd /opt/couple-app
ENV_FILE=".env"
if [ ! -f "$ENV_FILE" ]; then
  echo "缺少 $ENV_FILE"
  exit 1
fi
# shellcheck disable=SC1090
source "$ENV_FILE"
if [ -z "${WX_APPID:-}" ] || [ -z "${WX_APPSECRET:-}" ]; then
  echo "请先配置 WX_APPID / WX_APPSECRET"
  exit 1
fi
TOKEN=$(curl -s "https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${WX_APPID}&secret=${WX_APPSECRET}" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('access_token','')); sys.exit(0 if d.get('access_token') else 1)")
RAW=$(curl -s "https://api.weixin.qq.com/wxaapi/newtmpl/gettemplate?access_token=${TOKEN}")
echo "$RAW" > /tmp/wx_tmpl.json
python3 <<'PY'
import json, sys, re, os
with open("/tmp/wx_tmpl.json") as f:
    d = json.load(f)
if d.get("errcode") != 0:
    print("微信 API 错误:", d)
    sys.exit(1)
items = d.get("data") or []
if not items:
    print("当前小程序帐号下没有个人订阅模板。")
    print("请到 mp.weixin.qq.com → 功能 → 订阅消息 → 选用模板 添加后再运行本脚本。")
    sys.exit(2)
owner_id = ""
customer_id = ""
for t in items:
    title = (t.get("title") or "") + (t.get("content") or "")
    pid = t.get("priTmplId") or ""
    if not pid:
        continue
    if re.search(r"新订单|下单|订单提醒", title) and not owner_id:
        owner_id = pid
    elif re.search(r"状态|进度|发货|送达", title) and not customer_id:
        customer_id = pid
if not owner_id and items:
    owner_id = items[0].get("priTmplId", "")
if not customer_id and len(items) > 1:
    customer_id = items[1].get("priTmplId", "")
elif not customer_id and items:
    customer_id = items[0].get("priTmplId", "")
print("检测到模板:")
for t in items:
    print(" -", t.get("title"), "=>", t.get("priTmplId"))
print("建议 owner:", owner_id)
print("建议 customer:", customer_id)
path = os.environ.get("ENV_OUT", ".env.sync_result")
with open(path, "w") as f:
    f.write(f"WX_TEMPLATE_OWNER_NEW_ORDER={owner_id}\n")
    f.write(f"WX_TEMPLATE_CUSTOMER_ORDER_STATUS={customer_id}\n")
PY
# 合并进 .env
python3 <<'PY2'
import re
sync = {}
with open(".env.sync_result") as f:
    for line in f:
        if "=" in line:
            k, v = line.strip().split("=", 1)
            sync[k] = v
with open(".env") as f:
    lines = f.readlines()
keys = set(sync)
out = []
seen = set()
for line in lines:
    k = line.split("=", 1)[0].strip() if "=" in line else ""
    if k in keys:
        out.append(f"{k}={sync[k]}\n")
        seen.add(k)
    else:
        out.append(line)
for k, v in sync.items():
    if k not in seen:
        out.append(f"{k}={v}\n")
with open(".env", "w") as f:
    f.writelines(out)
print("已写入 .env")
PY2
rm -f .env.sync_result
echo "请执行: pm2 restart couple-app"
