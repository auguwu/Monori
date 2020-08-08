/**
 * Copyright (c) 2020 August
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { RouteDefinition, Method, RequiredBody, RequiredParameters, RequiredQueries } from '../decorators';
import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Website } from './Website';
import { Collection } from '@augu/immutable';

/**
 * Represents a route class from the definition
 */
export class Route {
  /** Any required parameters */
  public parameters: RequiredParameters[];

  /** If we should be authenicated to use this route */
  public authenicate: boolean;

  /** Any required queries */
  public queries: RequiredQueries[];

  /** Any required body loads */
  public body: RequiredBody[];

  /** The route's prefix */
  public prefix: string;

  /** The route's method */
  public method: Method;

  /** If the current users requires to be an admin */
  public admin: boolean;

  /** The type of authenication to use */
  public type: 'jwt' | 'none';

  /** The run function */
  public run: (this: BaseRouter, req: FastifyRequest, res: FastifyReply) => Promise<void>;

  /**
   * Constructs a new instance of Route
   * @param definition The definition
   */
  constructor(definition: RouteDefinition) {
    this.parameters = definition.parameters;
    this.authenicate = definition.authenicate;
    this.queries = definition.queries;
    this.prefix = definition.prefix;
    this.method = definition.method;
    this.admin = definition.admin;
    this.body = definition.body;
    this.type = definition.type;
    this.run = definition.run;
  }

  /**
   * Conjoins the other prefix to this route's prefix
   * @param prefix The prefix
   * @param other The other prefix to conjoin
   */
  static getPrefix(prefix: string, other: string) {
    return prefix === '/' ? other : `${other === '/' ? '' : other}${prefix}`;
  }
}

/**
 * Represents a base router to append routes to
 */
export class BaseRouter {
  /** The website */
  public website!: Website;

  /** The routes in a collection */
  public routes: Collection<Route>;

  /** The prefix of the route */
  public prefix: string;

  /**
   * Creates a new instance of BaseRouter
   * @param prefix The prefix
   */
  constructor(prefix: string) {
    this.routes = new Collection();
    this.prefix = prefix;
  }

  /**
   * Adds the `website` param to the constructor
   * @param website The website
   */
  init(website: Website) {
    this.website = website;
  }

  /**
   * Registers the routes to this router
   * @param routes The routes to add
   */
  register(routes: RouteDefinition[]) {
    for (const def of routes) {
      const route = new Route(def);
      const prefix = Route.getPrefix(route.prefix, this.prefix);
      route.prefix = prefix;

      this.routes.set(prefix, route);
    }
  }
}