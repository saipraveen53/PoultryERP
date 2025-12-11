import { Stack } from 'expo-router'
import React from 'react'

const Vendorlayout = () => {
  return (
    <Stack>
        <Stack.Screen name='Orders' />
        <Stack.Screen name='Report' />
    </Stack>
  )
}

export default Vendorlayout