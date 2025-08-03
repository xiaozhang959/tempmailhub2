#!/bin/bash

# EtempMail 测试脚本
BASE_URL="http://localhost:8787/api"

echo "🚀 测试 EtempMail 邮件服务..."
echo

# 测试支持的域名
DOMAINS=("ohm.edu.pl" "cross.edu.pl" "usa.edu.pl" "beta.edu.pl")

echo "📧 测试 EtempMail 指定域名功能"
echo

for domain in "${DOMAINS[@]}"; do
  echo "🔍 测试域名: $domain"
  
  # 创建指定域名的邮箱
  CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/mail/create" \
    -H "Content-Type: application/json" \
    -d '{
      "provider": "etempmail",
      "domain": "'$domain'"
    }')
  
  echo "创建邮箱响应:"
  echo "$CREATE_RESPONSE" | jq '.'
  
  # 提取邮箱信息
  ADDRESS=$(echo "$CREATE_RESPONSE" | jq -r '.data.address // "no-address"')
  ACTUAL_DOMAIN=$(echo "$CREATE_RESPONSE" | jq -r '.data.domain // "no-domain"')
  
  if [ "$ADDRESS" != "no-address" ] && [ "$ADDRESS" != "null" ]; then
    echo "✅ 成功创建邮箱: $ADDRESS"
    
    if [ "$ACTUAL_DOMAIN" = "$domain" ]; then
      echo "🎯 域名匹配成功: $ACTUAL_DOMAIN"
    else
      echo "⚠️  域名不匹配: 期望 $domain, 实际 $ACTUAL_DOMAIN"
    fi
    
    # 获取邮件列表
    echo "📋 获取邮件列表"
    EMAILS_RESPONSE=$(curl -s -X POST "${BASE_URL}/mail/list" \
      -H "Content-Type: application/json" \
      -d '{
        "address": "'$ADDRESS'",
        "provider": "etempmail"
      }')
    
    echo "邮件列表响应:"
    echo "$EMAILS_RESPONSE" | jq '.'
    
  else
    echo "❌ 创建邮箱失败"
    ERROR_MSG=$(echo "$CREATE_RESPONSE" | jq -r '.error // "未知错误"')
    echo "错误信息: $ERROR_MSG"
  fi
  
  echo "----------------------------------------"
  echo
done

# 测试不指定域名（随机域名）
echo "🎲 测试随机域名（不指定域名）"
RANDOM_RESPONSE=$(curl -s -X POST "${BASE_URL}/mail/create" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "etempmail"
  }')

echo "随机域名邮箱响应:"
echo "$RANDOM_RESPONSE" | jq '.'

RANDOM_ADDRESS=$(echo "$RANDOM_RESPONSE" | jq -r '.data.address // "no-address"')
RANDOM_DOMAIN=$(echo "$RANDOM_RESPONSE" | jq -r '.data.domain // "no-domain"')

if [ "$RANDOM_ADDRESS" != "no-address" ] && [ "$RANDOM_ADDRESS" != "null" ]; then
  echo "✅ 成功创建随机域名邮箱: $RANDOM_ADDRESS"
  echo "🎯 随机分配的域名: $RANDOM_DOMAIN"
else
  echo "❌ 创建随机域名邮箱失败"
fi

echo
echo "🎉 EtempMail 测试完成！"
echo
echo "💡 EtempMail 特点："
echo "1. 支持指定域名：ohm.edu.pl, cross.edu.pl, usa.edu.pl, beta.edu.pl"
echo "2. 支持随机域名（不指定 domain 参数）"
echo "3. 通过 changeEmailAddress 接口实现域名选择"
echo "4. 15分钟邮箱过期时间"
echo "5. 无需 accessToken" 