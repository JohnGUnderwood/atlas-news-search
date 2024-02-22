/** @type {import('next').NextConfig} */
// import { fileURLToPath } from 'url';
const dotenv = require('dotenv');
// const __filename = fileURLToPath(import.meta.url); // get the resolved path to the file
// const __dirname = path.dirname(__filename); // get the name of the directory
dotenv.config({path:__dirname + `/../.env`});

const nextConfig = {}

module.exports = nextConfig
