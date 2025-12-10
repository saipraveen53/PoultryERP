import { Drawer } from 'expo-router/drawer';
import React from 'react';

const Drawerlayout = () => {
  return (
     <Drawer>
        <Drawer.Screen   name='Dashboard'  />
     </Drawer>
  )
}

export default Drawerlayout;