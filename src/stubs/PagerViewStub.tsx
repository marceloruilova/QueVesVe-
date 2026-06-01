import React from 'react';
import { View } from 'react-native';

export const PagerView = ({ children, style, ...props }: any) => (
  <View style={style}>{children}</View>
);

export default PagerView;
