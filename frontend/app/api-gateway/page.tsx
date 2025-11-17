import React from 'react'
import Image from "next/image";


import Desktop from "@/./public/images/desktop.jpg"
import Phone from '@/public/images/phone.jpg'
import Laptop from '@/public/images/Laptop.jpg'

import { motion } from "framer-motion";
import Typography from '@mui/material/Typography'
// const MotionButton = motion(Button);

const page = () => {
  return (
    <div> 
        <div className='w-20 h-20 pt-12 ml-10'>
        <Image src={Desktop}  alt="Desktop"  />
        <Image src={Phone} alt="Laptop" className='mt-10' />
        <Image src={Laptop} alt='Phone' className='mt-10' />
        </div>
        <div className='w-30 h-100 bg-red-500 border-2 align-middle mt-30 ml-100 '>
    <Typography
  variant="h3"
  sx={{
    color: "white",
    fontFamily: "monospace",
    writingMode: "sideways-lr",
    textOrientation: "upright",
    padding: "25px",
    justifyContent : "center",
    alignItems: "center",
    alignContent: "center",

  }}
>
  Load Balancer
</Typography>
        </div>


    </div>
  )
}

export default page