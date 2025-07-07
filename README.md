# Web3 Communication with DR-SISM 🔐💬

A secure, decentralized communication platform that leverages **Web3 wallet-based authentication** and the **Dual Reversible Secret Image Sharing Mechanism (DR-SISM)** for encrypted image transmission.

## 🚀 Overview

This project combines the power of Web3 authentication and advanced image encryption using DR-SISM to enable **secure, trustless communication** between users. Users can chat using their crypto wallets and share sensitive images safely through a secret-sharing technique.

## ✨ Features

- 🔗 **Wallet-Based Login** (e.g., MetaMask, WalletConnect)
- 🧠 **Command-based Chat Interface**
- 🖼️ **Encrypted Image Sharing via DR-SISM**
- 🛡️ **End-to-End Secure Communication**
- ⚙️ Built with modern tech stack: React + Node.js + Web3 + Python (for DR-SISM)

## 🔐 What is DR-SISM?

**DR-SISM** (Dual Reversible Secret Image Sharing Mechanism) is a technique to split an image into multiple encrypted shares that can only be reconstructed together. This helps:
- Hide sensitive information
- Prevent unauthorized access
- Achieve privacy without needing heavy encryption

## 🛠️ Tech Stack

| Frontend        | Backend        | Blockchain      | Encryption Engine |
|----------------|----------------|------------------|-------------------|
| React + Tailwind CSS | Node.js + Express | ethers.js (Web3) | Python (DR-SISM) |

## 📦 Folder Structure

├── client/ # React frontend
│ ├── src/
│ └── public/
├── server/ # Node.js backend
├── drsism.py # Python logic for DR-SISM
├── .env # Environment variables
└── README.md
