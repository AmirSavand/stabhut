import { Card } from './card';

export class Column {
  id: number;
  name: string;
  cards: Card[];

  constructor(data) {
    this.id = data.id;
    this.name = data.name;
  }
}
