import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const API_KEY = process.env.MAILCHIMP_API_KEY;
        const API_SERVER = process.env.MAILCHIMP_API_SERVER;
        const AUDIENCE_ID = process.env.MAILCHIMP_AUDIENCE_ID;

        if (!API_KEY || !API_SERVER || !AUDIENCE_ID) {
            return NextResponse.json({ error: 'Mailchimp environment variables are missing' }, { status: 500 });
        }

        const data = {
            email_address: email,
            status: 'subscribed',
        };

        const response = await fetch(
            `https://${API_SERVER}.api.mailchimp.com/3.0/lists/${AUDIENCE_ID}/members`,
            {
                body: JSON.stringify(data),
                headers: {
                    Authorization: `apikey ${API_KEY}`,
                    'Content-Type': 'application/json',
                },
                method: 'POST',
            }
        );

        if (response.status >= 400) {
            const responseData = await response.json();
            if (responseData.title === 'Member Exists') {
                return NextResponse.json({ error: 'You are already subscribed!' }, { status: 400 });
            }
            return NextResponse.json({ error: responseData.title || 'Error subscribing to email list.' }, { status: 400 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
    }
}
