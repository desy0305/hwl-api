@echo off
echo Restarting HomeWizard development container...
docker restart homewizard-dev
echo Container restarted! Access at: http://localhost:3034
echo Network access at: http://YOUR_LOCAL_IP:3034
echo.
echo Port mapping: 3034 (external) -> 3033 (internal container)
echo EXPOSE 3033 in Dockerfile = internal container port
echo -p 3034:3033 in docker run = external:internal mapping
pause