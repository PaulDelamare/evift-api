type CustomContext = {
    set: { status?: number | string | undefined };
};

export function sendResponse(ctx: CustomContext, status: number, message: string): { message: string };
export function sendResponse<T>(ctx: CustomContext, status: number, data: T): { data: T };

export function sendResponse<T>(
    ctx: CustomContext,
    status: number,
    payload: string | T
): { message: string } | { data: T } {
    ctx.set.status = status;
    if (typeof payload === 'string') {
        return { message: payload };
    }
    return { data: payload };
}
