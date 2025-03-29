import { NextResponse } from 'next/server';
import { SERVICE_TYPES, SERVICES, ServiceType } from '@obscuranet/shared';

export async function POST(request: Request) {
  try {
    const { userId, tokenType, amount, serviceType } = await request.json();

    // Validate inputs
    if (!userId || !tokenType || !amount || !serviceType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Check if service type is valid
    if (!Object.values(SERVICE_TYPES).includes(serviceType)) {
      return NextResponse.json(
        { error: `Invalid service type: ${serviceType}` },
        { status: 400 }
      );
    }

    // Get service details
    const service = SERVICES[serviceType as ServiceType];
    
    // In a real implementation, this would call our Firebase function
    // const { data } = await httpsCallable(functions, 'spendTokens')({
    //   userId,
    //   tokenType,
    //   amount,
    //   serviceType
    // });
    
    // For demonstration purposes, we'll simulate a successful spending event
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate a random ID for the spend log
    const spendLogId = Math.random().toString(36).substring(2, 15);
    
    // Simulate successful token spending
    return NextResponse.json({
      success: true,
      spendLogId,
      serviceType,
      serviceName: service.name,
      tokenType,
      amount: parseFloat(amount),
      timestamp: new Date().toISOString(),
      newBalance: {
        STX: tokenType === 'STX' ? Math.max(0, 12.3 - parseFloat(amount)) : 12.3,
        VIZ: tokenType === 'VIZ' ? Math.max(0, 9.7 - parseFloat(amount)) : 9.7,
        LOG: tokenType === 'LOG' ? Math.max(0, 5.2 - parseFloat(amount)) : 5.2,
        CRE: 7.6,
        ANA: 8.4,
        SYN: 6.1,
      },
      message: `Successfully used ${amount} ${tokenType} tokens for ${service.name}.`,
    });
  } catch (error: any) {
    console.error('Error spending tokens:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to spend tokens',
        success: false
      },
      { status: 500 }
    );
  }
}