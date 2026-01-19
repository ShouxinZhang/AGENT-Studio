export type DbObjectType = "table" | "view";

export type DbObjectRef = {
    schema: string;
    name: string;
    type: DbObjectType;
};

export type TablePage = {
    schema: string;
    name: string;
    limit: number;
    offset: number;
    columns: string[];
    rows: Array<Record<string, unknown>>;
    rowCount: number;
    mock?: boolean;
};
