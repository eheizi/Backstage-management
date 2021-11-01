import { Db } from "mongodb";

declare function link_mongo(dbName: string): Promise<Db>;

export = link_mongo;