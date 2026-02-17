$body = @{
    prisonId = "auckland"
    title = "Test Briefing"
    content = "This is a test message"
    postedBy = "Admin"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3001/api/data/briefing' -Method POST -Body $body -ContentType 'application/json'
