declare module 'nsfwjs' {
  export interface Prediction {
    className: 'Drawing' | 'Hentai' | 'Neutral' | 'Porn' | 'Sexy';
    probability: number;
  }
  export interface NSFWJSModel {
    classify(image: any, topk?: number): Promise<Prediction[]>;
  }
  export function load(modelOrUrl?: any, options?: any): Promise<NSFWJSModel>;
  const nsfwjs: {
    load: typeof load;
  };
  export default nsfwjs;
}
