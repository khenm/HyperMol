# HyperMol 🧬

![HyperMol Banner](assets/banner.jpg)

<div align="center">

[![Live Demo](https://img.shields.io/badge/demo-live-green?style=for-the-badge&logo=github)](https://khenm.github.io/HyperMol/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](LICENSE)
[![Powered By Mol*](https://img.shields.io/badge/Powered%20By-Mol*-purple?style=for-the-badge)](https://molstar.org/)

**A high-performance, WebGL2-accelerated molecular viewer for the web.**

</div>

## 📖 About

**HyperMol** is a modern, lightweight molecular visualization interface built on top of the robust **[Mol* (Molstar)](https://molstar.org/)** library. 

Leveraging the advanced rendering capabilities of Mol*, HyperMol provides a simplified, user-friendly playground for researchers and students to analyze complex PDB structures with high fidelity and smooth performance directly in the browser.

## ✨ Key Features

HyperMol wraps the powerful Mol* API to provide a focused set of capabilities:

* **📂 Flexible Data Import**
    * Fetch directly from RCSB PDB using **PDB IDs** (e.g., `1BNA`).
    * **Drag & Drop** support for local files.
    * Supports `.pdb` and binary `.bcif` formats.

* **🎨 Advanced Rendering**
    * Multiple representation styles (e.g., **Cartoon**, Stick, Sphere).
    * Customizable coloring schemes (e.g., **By Chain**, By Element, B-factor).

* **📏 Measurements Playground**
    * Interactive selection modes: **Residue** or **Atom**.
    * Calculate precise geometry:
        * **Distance** (2 atoms)
        * **Angle** (3 atoms)
        * **Torsion** (4 atoms)

* **🎬 Simulation & Playback**
    * Built-in sequence playback controls to visualize molecular dynamics or trajectories.

* **📸 High-Res Export**
    * Capture publication-quality screenshots directly from the viewer canvas.

## 🚀 Getting Started

To run HyperMol locally on your machine for development:

### Prerequisites
* Node.js (v16 or higher)
* npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/khenm/HyperMol.git](https://github.com/khenm/HyperMol.git)
    cd HyperMol
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    # or
    yarn dev
    ```

4.  Open your browser to `http://localhost:5173` (or the port shown in your terminal).

## 🛠️ Tech Stack

* **Visualization Engine:** [Mol* (Molstar)](https://molstar.org/) - Used for core rendering, parsing, and data management.
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **UI Framework:** React / Vue *(Update based on your actual framework)*
* **Build Tool:** Vite

## 👏 Acknowledgements

This project is built using the **Mol* (Molstar)** framework. We gratefully acknowledge the creators and contributors of Mol* for providing the open-source tools that make high-performance molecular visualization possible on the web.

* **[Mol* Repository](https://github.com/molstar/molstar)**
* **[Mol* Documentation](https://molstar.org/)**

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📧 Contact

Project Link: [https://github.com/khenm/HyperMol](https://github.com/khenm/HyperMol)

---

*Note: This project is currently in active development.*
