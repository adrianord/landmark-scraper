export type Apartment = {
  name: string,
  availability: {
    number: string,
    rent: number,
    available: Date
  }[]
}
