export interface Station {
  id: string;
  name: string;
  postcode: string;
}

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  mpg: number;
  registration: string;
}

export interface Calculation {
  id: string;
  from: string;
  to: string;
  distance: number;
  time: number;
  vehicle: {
    id: string;
    make: string;
    model: string;
    mpg: number;
    registration: string;
  };
  fuel: number;
  timestamp: number;
}
