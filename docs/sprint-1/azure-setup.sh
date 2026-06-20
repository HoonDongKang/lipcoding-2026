#!/bin/bash
# Smart Task Hub — Azure 초기 설정 스크립트
# 실행 전: az login 완료 필요
# 사용법: bash docs/sprint-1/azure-setup.sh

set -e

SUBSCRIPTION_ID="69565369-202d-44b7-af16-5cf4cbb98ee9"
RESOURCE_GROUP="smart-task-hub-rg"
LOCATION="koreacentral"
APP_SERVICE_PLAN="smart-task-hub-plan"
APP_SERVICE_NAME="smart-task-hub-api"
STATIC_WEB_APP_NAME="smart-task-hub-web"
KEY_VAULT_NAME="smart-task-hub-kv"

echo "=== Azure 구독 설정 ==="
az account set --subscription $SUBSCRIPTION_ID

echo "=== 리소스 그룹 생성 ==="
az group create --name $RESOURCE_GROUP --location $LOCATION

echo "=== App Service Plan 생성 (B1 tier) ==="
az appservice plan create \
  --name $APP_SERVICE_PLAN \
  --resource-group $RESOURCE_GROUP \
  --sku B1 \
  --is-linux

echo "=== App Service (Backend) 생성 ==="
az webapp create \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --plan $APP_SERVICE_PLAN \
  --runtime "NODE:20-lts"

echo "=== Static Web App (Frontend) 생성 ==="
az staticwebapp create \
  --name $STATIC_WEB_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Free

echo "=== Key Vault 생성 ==="
az keyvault create \
  --name $KEY_VAULT_NAME \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION

echo "=== App Service Managed Identity 활성화 ==="
az webapp identity assign \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP

echo "=== Key Vault 접근 권한 부여 ==="
PRINCIPAL_ID=$(az webapp identity show \
  --name $APP_SERVICE_NAME \
  --resource-group $RESOURCE_GROUP \
  --query principalId -o tsv)

az keyvault set-policy \
  --name $KEY_VAULT_NAME \
  --object-id $PRINCIPAL_ID \
  --secret-permissions get list

echo ""
echo "✅ Azure 설정 완료!"
echo ""
echo "다음 단계:"
echo "1. GitHub 레포 생성: https://github.com/new (이름: lipcoding-2026)"
echo "2. git remote add origin https://github.com/YOUR_USERNAME/lipcoding-2026.git"
echo "3. git push -u origin main"
echo "4. GitHub Secrets 등록 (Settings > Secrets > Actions):"
echo "   - AZURE_APP_SERVICE_NAME: $APP_SERVICE_NAME"
echo "   - AZURE_WEBAPP_PUBLISH_PROFILE: (App Service > 게시 프로필 다운로드)"
echo "   - AZURE_STATIC_WEB_APPS_API_TOKEN: (Static Web App > 관리 토큰)"
echo "   - VITE_API_URL: https://$APP_SERVICE_NAME.azurewebsites.net"
