self.MonacoEnvironment = {
    getWorker: async function (workerId, label) {
        const worker = await import('monaco-editor/esm/vs/editor/editor.worker?worker');
        return new worker.default();
    }
};
