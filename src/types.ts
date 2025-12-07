
export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductItem {
  name: string;
  description: string;
  specs: ProductSpec[];
  image: string;
}

export interface StoryCard {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  fullContent: string;
  image: string;
  coordinates: string;
  type: 'product' | 'ethos' | 'process' | 'catalog';
  productList?: ProductItem[];
}

export interface GeometryState {
  mouseX: number;
  mouseY: number;
  isExpanded: boolean;
}

export interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}
