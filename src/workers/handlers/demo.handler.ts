export const processDemoJob = async (
    payload: Record<string, unknown>
) => {
    const message = payload.message;

    if (typeof message !== "string" || !message.trim()) {
        throw new Error("Invalid message payload");
    }

    console.log("Processing demo job:", message);

    // Simulate a time-consuming task
    await new Promise((resolve) => setTimeout(resolve, 3000));

    console.log("Demo job completed:", message);

    return {
        success: true,
        message,
        processedAt: new Date().toISOString(),
    };
};