# Download the Corrections logo and save as corrections-logo-large.png in the public folder
$logoUrl = "https://www.corrections.govt.nz/__data/assets/image/0003/39360/Corrections-Logo-Blue-Maori-stacked.jpg"
$outputPath = "public/corrections-logo-large.png"

Invoke-WebRequest -Uri $logoUrl -OutFile $outputPath
Write-Host "Downloaded logo to $outputPath"