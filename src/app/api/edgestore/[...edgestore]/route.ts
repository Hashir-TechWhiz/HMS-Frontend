import { initEdgeStore } from "@edgestore/server";
import { createEdgeStoreNextHandler } from "@edgestore/server/adapters/next/app";

const es = initEdgeStore.create();

const edgeStoreRouter = es.router({
    rooms: es
        .fileBucket({
            maxSize: 4 * 1024 * 1024, // 4MB
            accept: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
        })
        .beforeDelete(async ({ fileInfo }) => {
            console.log("Deleting EdgeStore file:", fileInfo.url);
            return true;
        }),
    facilities: es
        .fileBucket({
            maxSize: 4 * 1024 * 1024, // 4MB
            accept: ["image/png", "image/jpeg", "image/svg+xml", "image/webp"],
        })
        .beforeDelete(async ({ fileInfo }) => {
            console.log("Deleting EdgeStore file:", fileInfo.url);
            return true;
        }),
});

const handler = createEdgeStoreNextHandler({
    router: edgeStoreRouter,
});

export { handler as GET, handler as POST };

export type EdgeStoreRouter = typeof edgeStoreRouter;
