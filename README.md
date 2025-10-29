# Skräddar: A custom IKEA SKADIS pegboard generator for 3D Printing
Need to create a specific SKADIS Pegboard for 3D Printing? Use the Skräddar generator to get your desired dimensions (export as .stl)!

| :zap:        Visit [skraeddar.torminal.com](https://skraeddar.torminal.com) to view this project  |
|------------------------------------------|

---

## What is Skräddar
* Skräddar allows you to create custom IKEA SKADIS Pegboard for 3D Printing!
* set custom width, height and thickness of the pegboard
* export as .stl for your 3D Print
* Select, if you want holes for mounting the pegboard (with spacers)

---

## "Making of"
**The build**  
I am honest - this is build with a lot of support from https://claude.ai. The basic structure was generated, the code was edited from me until i liked it - so not completely "vibe-coded".  
If you dont trust the website [skraeddar.torminal.com](https://skraeddar.torminal.com) or want an offline version, just host it yourself with npm (use the installation instructions in this ReadMe).  
**The name**  
The name "Skräddar" comes from the swedish word skräddarsydd, which means "tailored" - i thought, this is a fitting title for a project like this!  
**The inspiration**  
Also visit https://skapa.build/ - Skräddar is strongly inspired from it (it doesnt look as nice as skapa, but anyways..) and allows you to create customized boxes you can integrate on SKADIS.  

## Installation 
### 📋 Prerequisites

Before you begin, make sure you have the following installed on your computer:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

To check if Node.js is installed, open your terminal/command prompt and run:
```bash
node --version
npm --version
```

### 🚀 Installation Steps

Step 1: Extract the ZIP file
Extract the downloaded ZIP file from this repo to your desired location.

Step 2: Open Terminal/Command Prompt
Navigate to the project folder:
```bash
cd path/to/skadis-generator
```

Step 3: Install Dependencies
Install all required packages:
```bash
npm install
```

This will download and install all necessary dependencies. This may take a few minutes.

Step 4: Start Development Server
Start the local development server:
```bash
npm run dev
```

You should see output similar to:
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Step 5: Open in Browser
Open your web browser and navigate to:
```
http://localhost:5173
```

🎉 **You should now see the SKÅDIS Generator running!**

### 📦 Building for Production

To create a production-ready build:

```bash
npm run build
```

The built files will be in the `dist/` folder. You can upload these files to any web hosting service.

### 🐛 Troubleshooting

"command not found: npm"
- Install Node.js from [nodejs.org](https://nodejs.org/)

Port already in use
- Change the port: `npm run dev -- --port 3000`
- Or kill the process using the port

Build errors
- Delete `node_modules` folder
- Delete `package-lock.json`
- Run `npm install` again

Three.js warnings
- These are normal and don't affect functionality
- The project uses Three.js r128 for compatibility

## 🤝 Credits

- Built with the help of [Claude AI](https://claude.ai)
- Impressum: [torminal.com/impressum](https://torminal.com/impressum/)

---

Happy printing! 🎉
