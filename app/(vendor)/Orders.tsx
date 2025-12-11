import { Link } from 'expo-router'
import React from 'react'
import { Text, View } from 'react-native'

const Orders = () => {
  return (
    <View>
      <Text>Orders</Text>
      <Link  href='/Report' >Go to orders Page</Link>
    </View>
  )
}

export default Orders