interface TextStyle {
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  fontSmoothing?: string;
  lineHeight?: string;
  textTransform?: string;
  letterSpacing?: string;
}

interface BlockStyle {
  background?: string;
  borderRadius?: number | string;
  boxShadow?: string;
  borderStyle?: string;
  borderColor?: number | string;
  borderWidth?: number | string;
}

export interface ButtonStyle {
  base?: TextStyle & BlockStyle;
  hover?: TextStyle & BlockStyle;
  focus?: TextStyle & BlockStyle;
}

interface InputAllowedStyle {
  height?: number;
  padding?: number;

  background?: string;
  borderRadius?: number | string;
  boxShadow?: string;

  borderStyle?: string;
  borderColor?: string;
  borderWidth?: number | string;

  color?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontSize?: string;
  fontSmoothing?: string;
  lineHeight?: string;
}

export interface InputStyle {
  base?: InputAllowedStyle;
  hover?: InputAllowedStyle;
  focus?: InputAllowedStyle;
  error?: InputAllowedStyle;
}

export interface LoaderStyle {
  backgroundColor: string;
  color: string;
}
