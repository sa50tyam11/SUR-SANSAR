declare module '@svg-maps/india' {
  const IndiaMapData: {
    label: string;
    viewBox: string;
    locations: Array<{
      id: string;
      name: string;
      path: string;
    }>;
  };
  export default IndiaMapData;
}
