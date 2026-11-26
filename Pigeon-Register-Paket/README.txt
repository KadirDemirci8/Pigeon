Pigeon Register V1

The chosen sunset/cherry-blossom illustration is retained. Only its left baked-in text area has been retouched so the actual selectable heading and copy can be rendered in HTML. The right illustration's card is fully overlaid by the working form; corner touch-ups may be required based on the browser size.

Install from the project root:
Expand-Archive -Path "$env:USERPROFILE\Downloads\Pigeon-Register-Paket.zip" -DestinationPath . -Force
powershell -ExecutionPolicy Bypass -File ".\Pigeon-Register-Paket\install.ps1"

Then open http://localhost:5173/register. The API should be running at https://localhost:7151.

Backup: Pigeon-Register-Paket\backup\Register.jsx, Register.css

No changes are made to Login.jsx, Login.css, App.jsx or backend code.
