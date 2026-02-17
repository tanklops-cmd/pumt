$token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3NzEwNjM2MDUsImV4cCI6MTc3MTE1MDAwNX0.1l8nhaX9ccptRGPkfe_xLj7WzN8ByLy3M3xhRdOoU2I"

$body = @{
    pageName = "UnitHub"
    unitId = "north"
    htmlSnapshot = "<html><body>Test from PowerShell - unit state</body></html>"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3001/api/audit/capture" -Method POST -Body $body -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}

Write-Host $response