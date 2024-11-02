import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
	const { transactionId } = (await req.json())

	const response = await fetch(
		`https://developer.worldcoin.org/api/v2/minikit/transaction/${transactionId}?app_id=${process.env.NEXT_PUBLIC_APP_ID}&type=transaction`,
		{
			method: 'GET',
			headers: {
				Authorization: `Bearer ${process.env.DEV_PORTAL_API_KEY}`,
			},
		}
	)
	const transaction = await response.json()

	return NextResponse.json(transaction)
}