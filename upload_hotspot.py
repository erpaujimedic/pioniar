import ftplib
import os

files_to_upload = ['login.html', 'logout.html', 'status.html', 'alogin.html']

try:
    ftp = ftplib.FTP('192.168.100.1', timeout=15)
    ftp.login('admin', 'Liveforever27*')
    print("Connected to Mikrotik FTP")
    
    # Change directory to flash/hotspot
    ftp.cwd('flash/hotspot')
    print("Changed directory to flash/hotspot")
    
    for filename in files_to_upload:
        if os.path.exists(filename):
            with open(filename, 'rb') as f:
                ftp.storbinary(f'STOR {filename}', f)
            print(f"Successfully uploaded {filename}")
        else:
            print(f"File {filename} not found locally!")
            
    ftp.quit()
    print("All files uploaded successfully!")
except Exception as e:
    print(f"Error: {e}")
