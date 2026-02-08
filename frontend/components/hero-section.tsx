"use client";

import React from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { TextEffect } from '@/components/ui/text-effect'
import { AnimatedGroup } from '@/components/ui/animated-group'
import { HeroHeader } from "@/components/header"
import IntegrationsSection from "@/components/integrations-4"

import { motion } from "framer-motion";
const MotionButton = motion(Button);


import system_design from "@/public/images/system_design.jpg"

const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: 'blur(12px)',
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: 'blur(0px)',
            y: 0,
            transition: {
                type: 'spring',
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
}

export default function MainSection() {
    return (
        <>
          
            <main className="overflow-hidden h-screen">
                <div
                    aria-hidden
                    className="absolute inset-0 isolate hidden opacity-65 contain-strict lg:block">
                    <div className="w-140 h-320 -translate-y-87.5 absolute left-0 top-0 -rotate-45 rounded-full bg-[radial-gradient(68.54%_68.72%_at_55.02%_31.46%,hsla(0,0%,85%,.08)_0,hsla(0,0%,55%,.02)_50%,hsla(0,0%,45%,0)_80%)]" />
                    <div className="h-320 absolute left-0 top-0 w-60 -rotate-45 rounded-full bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.06)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)] [translate:5%_-50%]" />
                    <div className="h-320 -translate-y-87.5 absolute left-0 top-0 w-60 -rotate-45 bg-[radial-gradient(50%_50%_at_50%_50%,hsla(0,0%,85%,.04)_0,hsla(0,0%,45%,.02)_80%,transparent_100%)]" />
                </div>
                <section>
                    <div className="relative pt-24 md:pt-36">
                        <AnimatedGroup
                            variants={{
                                container: {
                                    visible: {
                                        transition: {
                                            delayChildren: 1,
                                        },
                                    },
                                },
                                item: {
                                    hidden: {
                                        opacity: 0,
                                        y: 20,
                                    },
                                    visible: {
                                        opacity: 1,
                                        y: 0,
                                        transition: {
                                            type: 'spring',
                                            bounce: 0.3,
                                            duration: 2,
                                        },
                                    },
                                },
                            }}
                            className="mask-b-from-35% mask-b-to-90% absolute inset-0 top-56 -z-20 lg:top-32"
                        >
                            <div aria-hidden className="size-full" />
                        </AnimatedGroup>

                        <div
                            aria-hidden
                            className="absolute inset-0 -z-10 size-full [background:radial-gradient(125%_125%_at_50%_100%,transparent_0%,var(--color-background)_75%)]"
                        />

                        <div className="mx-auto max-w-7xl px-6">
                            <div className="text-center sm:mx-auto lg:mr-100 lg:mt-0">

             
  {/* <Image
    src={system_design}
    alt="System Design Diagram"
    className="w-130 ml-200 h-auto max-w-md lg:max-w-full rounded-xl object-cover shadow-2xl transition-all duration-500 hover:scale-[1.02] hover:shadow-3xl hover:-translate-y-2"
    width="3276"
    height="4095"
  /> */}


                                
                                <TextEffect
                                    preset="fade-in-blur"
                                    speedSegment={0.1}
                                    as="h1"
                                    className="mx-auto mt-2  font-serif max-w-4xl text-balance text-5xl max-md:font-semibold md:text-9xl lg:mt-3 xl:text-[7rem] text-yellow-300">
                                    System Desing PlayGround
                                </TextEffect>
                    
                                <TextEffect
                                    per="line"
                                    preset="fade-in-blur"
                                    speedSegment={0.3}
                                    delay={0.2}
                                    as="p"
                                    className="mx-auto mt-8 max-w-2xl text-balance text-lg font-mono">
                                    A Place where you visualize and interact with Real Time Implemented System Design Topics.
                                </TextEffect>

                                <AnimatedGroup
                                    variants={{
                                        container: {
                                            visible: {
                                                transition: {
                                                    staggerChildren: 0.05,
                                                    delayChildren: 0.75,
                                                },
                                            },
                                        },
                                        ...transitionVariants,
                                    }}
                                    className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row">
                                    <div
                                        key={1}
                                        className="bg-foreground/10 rounded-[calc(var(--radius-xl)+0.125rem)] border p-0.5">
                                        <Button
                                            asChild
                                            size="lg"
                                            className="rounded-xl px-5 text-base">
                                            <Link href="#link">
                                                <span className="text-nowrap">Review This</span>
                                            </Link>
                                        </Button>
                                    </div>
                                  <MotionButton
                                    key={2}
                                    size="lg"
                                    variant="ghost"
                                    className="h-10.5 rounded-xl px-5 bg-gray-900"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    asChild
                                >
                                <Link
                                    href="https://portfolio-1-gold-five-67.vercel.app/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <span className="text-nowrap">Aman Bani</span>
                                </Link>
                                </MotionButton>
                                </AnimatedGroup>
                            </div>
                            
                        </div>

                         
                    </div>
                </section>
                
            </main>
        </>
    )
}