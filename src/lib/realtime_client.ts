"use client"


import {realtime, RealTimeEvents} from "@/lib/realtime";
import {createRealtime} from "@upstash/realtime/client";


export const {useRealtime} = createRealtime<RealTimeEvents>()