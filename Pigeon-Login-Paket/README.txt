PIGEON LOGIN TASARIM PAKETI

1) ZIP'i C:\Users\Kadir\Desktop\Pigeon klasorune ayiklayin (Pigeon-Login-Paket klasoru olusacak).
2) VS Code'da Pigeon projesinin ana klasorunde PowerShell terminali acin.
3) Su komutu CALISTIRIN:
   powershell -ExecutionPolicy Bypass -File ".\Pigeon-Login-Paket\install.ps1"

Bu islem:
- Mevcut Login.jsx ve Login.css dosyalarini yedekler.
- Login.jsx ve Login.css dosyalarini hazir, calisan tasarimla degistirir.
- Secilen referans gorselini frontend/public/pigeon-login-reference.png konumuna koyar.

Masaustu: Seçilen gorsel ASLI, aynen korunur; form alanlari ve Login, Sign up aktif HTML katmanlaridir.
Mobil: Gercek responsive form gorunur.
Google login ve Forgot Password: backend olmadigi icin etkin degil.
Not: Bu yontemde sol metinler ve dekorasyon masaustunde gorselin parcasidir, HTML metni degildir.
