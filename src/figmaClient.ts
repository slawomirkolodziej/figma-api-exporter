export type ErrorResponse = {
    err: string;
} | {
    error: string
}

export interface FileImageResponse {
    images: {
        [key: string]: string;
    };
}

export interface Node {
    /** a string uniquely identifying this node within the document */
    id: string;
    /** the name given to the node by the user in the tool. */
    name: string;
    /** whether or not the node is visible on the canvas */
    visible?: boolean;
    /** the type of the node, refer to table below for details */
    type: 'DOCUMENT'
    | 'CANVAS'
    | 'FRAME'
    | 'GROUP'
    | 'VECTOR'
    | 'BOOLEAN_OPERATION'
    | 'STAR'
    | 'LINE'
    | 'ELLIPSE'
    | 'REGULAR_POLYGON'
    | 'RECTANGLE'
    | 'TEXT'
    | 'SLICE'
    | 'COMPONENT'
    | 'COMPONENT_SET'
    | 'INSTANCE';
    /** data written by plugins that is visible only to the plugin that wrote it. Requires the `pluginData` to include the ID of the plugin. */
    pluginData?: any;
    /** data written by plugins that is visible to all plugins. Requires the `pluginData` parameter to include the string "shared". */
    sharedPluginData?: any;
    /** The children of the node, if any */
    children?: Node[];
}

export interface FileResponse {
    components: {
        [key: string]: unknown;
    };
    styles: {
        [key: string]: unknown;
    };
    document: Node;
    lastModified: string;
    name: string;
    role: 'editor' | 'viewer' | 'owner';
    schemaVersion: number;
    thumbnailUrl: string;
    version: string;

}

export default class FigmaClient {
    headers: Record<string, string>;
    baseUrl = 'https://api.figma.com/v1';

    constructor(options: { personalAccessToken: string } | { accessToken: string }) {
        this.headers = 'personalAccessToken' in options ? {
            'X-Figma-Token': options.personalAccessToken
        } : {
            'Authorization': `Bearer ${options.accessToken}`
        };
    }

    async get<T extends {}>(path: string, params?: Record<string, string | string[] | number | boolean>): Promise<T> {
        const query = new URLSearchParams()
        for (const [key, value] of Object.entries(params ?? {})) {

            const formattedValue = Array.isArray(value) ? value.join(',') : value;

            if (!formattedValue) continue;
            query.set(key, formattedValue.toString());
        }

        const queryString = query.size === 0 ? '' : `?${query.toString().replaceAll('%3A', ':').replaceAll('%2C', ',')}`;
        const data = await fetch(`${this.baseUrl}/${path}${queryString}`, {
            headers: this.headers,
        })
            .then(r => r.json()) as T | ErrorResponse;

        if ('err' in data && data.err) {
            throw new Error(data.err);
        }

        if ('error' in data && data.error) {
            throw new Error(data.error);
        }

        return data as T;
    }

    // See https://www.figma.com/developers/api#get-files-endpoint
    file(fileId: string, params?: { ids?: string[] }) {
        return this.get<FileResponse>(`files/${fileId}`, params);
    }

    // See https://www.figma.com/developers/api#get-images-endpoint
    fileImages(fileId: string, params?: {
        ids?: string[],
        scale?: number,
        format?: 'svg' | 'png' | 'jpg' | 'pdf',
        svg_outline_text?: boolean,
        svg_include_id?: boolean,
        svg_include_node_id?: boolean,
        svg_simplify_stroke?: boolean,
        contents_only?: boolean,
        use_absolute_bounds?: boolean,
        version?: number,
    }) {
        return this.get<FileImageResponse>(`images/${fileId}`, params);
    }
}
