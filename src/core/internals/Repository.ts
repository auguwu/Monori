import { Collection } from 'mongodb';
import { Website } from '..';

export default abstract class Repository<TModel = any> {
  public name: string;
  #website: Website;

  constructor(web: Website, name: string) {
    this.#website = web;
    this.name = name;
  }

  get collection(): Collection<TModel> {
    return this.#website.database.getCollection(this.name);
  }

  public abstract get(id: string): Promise<TModel>;
  public abstract create(packet: any): Promise<TModel>;
  public abstract remove(id: string): Promise<void>;
  public abstract update(type: 'set' | 'push', userID: string, values: { [x: string]: any }): Promise<void>;
}