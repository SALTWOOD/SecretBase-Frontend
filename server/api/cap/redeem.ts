import cap from "~~/server/utils/cap";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { token, solutions } = body || {};

    if (!token || !solutions) {
        setResponseStatus(event, 400);
        return { success: false, message: "Missing token or solutions" };
    }

    try {
        const result = await cap.redeemChallenge({ token, solutions });
        
        return result; 
    } catch (error: any) {
        setResponseStatus(event, 400);
        return { success: false, message: error.message };
    }
});