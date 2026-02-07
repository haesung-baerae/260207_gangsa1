
export interface Recipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  tips?: string;
}

export interface ApiResponse {
  recipe: string;
  imageUrl?: string;
  error?: string;
}
