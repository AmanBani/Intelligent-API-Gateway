"use client";

import React from 'react';
import Image from "next/image";
import { motion } from "framer-motion";

import Desktop from "@/./public/images/desktop.jpg";
import Phone from '@/public/images/phone.jpg';
import Laptop from '@/public/images/Laptop.jpg';

const page = () => {
  return (
    <>
    <div className=' w-screen h-screen '>
       <h1 className="font-sans font-bold text-7xl text-white flex items-center justify-center -mb-2.5">
            Intelligent API Gateway
        </h1>
    <div className="flex items-center  min-h-screen bg-black p-2">
     
      <div className="flex items-center gap-8">
        
        <div className="flex flex-col gap-20">
          <div className="w-24 h-20">
            <Image src={Desktop} alt="Desktop" width={96} height={80} />
          </div>
          <div className="w-24 h-20">
            <Image src={Phone} alt="Phone" width={96} height={80} />
          </div>
          <div className="w-24 h-20">
            <Image src={Laptop} alt="Laptop" width={96} height={80} />
          </div>
        </div>

            <div className="relative flex items-center" style={{ width: '250px', height: '400px' }}>

          <svg width="250" height="400" className="absolute" style={{ left: 0 }}>
            <line x1="0" y1="50" x2="250" y2="200" stroke="#fbbf24" strokeWidth="3" />
            <line x1="0" y1="200" x2="250" y2="200" stroke="#fbbf24" strokeWidth="3" />
            <line x1="0" y1="350" x2="250" y2="200" stroke="#fbbf24" strokeWidth="3" />
          </svg>
          
          <motion.div
            className="absolute w-20 h-8 bg-orange-400 flex items-center justify-center text-white font-bold text-sm rounded"
            initial={{ x: -10, y: -140 }}
            animate={{ x: 170, y: 5}}
            transition={{
              duration: 10,
              delay:2,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear"
            }}
          >
            Request
          </motion.div>
          
           <motion.div
            className="absolute w-20 h-8 bg-orange-400 flex items-center justify-center text-white font-bold text-sm rounded"
            initial={{ x: 0, y: 3 }}
            animate={{ x: 200, y: 0 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: 2
            }}
          >
            Request
          </motion.div>
          
          <motion.div
            className="absolute w-20 h-8 bg-orange-400 flex items-center justify-center text-white font-bold text-sm rounded"
            initial={{ x: 0, y: 140 }}
            animate={{ x: 170, y: -5 }}
            transition={{
              duration: 10,
              repeat: Infinity,
              repeatType: "loop",
              ease: "linear",
              delay: 2
            }}
          >
            Request
          </motion.div>
        </div>


     <div className="flex items-center relative">

  {/* Load Balancer */}
  <div className="bg-red-500 flex items-center justify-center"
       style={{ width: "100px", height: "400px" }}>
    <span
      className="text-white font-mono text-2xl p-6"
      style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
    >
      Load Balancer
    </span>
  </div>

  {/* YELLOW LINE BETWEEN LB & API GATEWAY */}
  <svg width="300" height="400" className="absolute left-[100px]">
    <line x1="0" y1="200" x2="300" y2="200" stroke="#fbbf24" strokeWidth="4" />
  </svg>
     <motion.div
    className="absolute w-20 h-8 bg-orange-400 flex items-center justify-center text-white font-bold text-sm rounded"
    style={{ top: "192px" }}  // aligns vertically on yellow line
    initial={{ x: 100 }}
    animate={{ x: 300 }}       // moves exactly from start to end of line
    transition={{
      duration: 8,
      repeat: Infinity,
      repeatType: "loop",
      ease: "linear",
      delay: 11,
    }}
  >
    Request
  </motion.div>

  {/* API Gateway */}
  <div className="bg-red-500 flex items-center justify-center ml-[300px]"
       style={{ width: "100px", height: "400px" }}>
    <span
      className="text-white font-mono text-2xl p-6"
      style={{ writingMode: "vertical-rl", textOrientation: "mixed" }}
    >
      API Gateway
    </span>
  </div>

      <svg width="250" height="400" className="absolute" style={{ left: 500 }}>
            <line x1="0" y1="200" x2="250" y2="50" stroke="#fbbf24" strokeWidth="3" />
            <line x1="0" y1="200" x2="250" y2="200" stroke="#fbbf24" strokeWidth="3" />
            <line x1="0" y1="200" x2="250" y2="350" stroke="#fbbf24" strokeWidth="3" />
      </svg>

  

</div>



      </div>
    </div>
    

    {/* CODE SECTION */}
    <div>


    </div>





    </div>
    </>
  );
};

export default page;