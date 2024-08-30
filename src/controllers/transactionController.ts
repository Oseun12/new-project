import { Request, Response } from "express";
import { Transaction, ITransaction } from "../models/Transaction";
import { User } from "../models/User";
import axios from "axios";

export async function convertAirtimeToCash(req: Request, res: Response) {
    const { userId, network, airtimeCode, amount, phoneNumber } = req.body;

    try {
        const newTransaction: ITransaction = new Transaction({
            userId, network, airtimeCode, amount, phoneNumber
        });

        await newTransaction.save();

        //Connecting to the network provider
        const apiResponse = await axios.post('/', {
            network, airtimeCode, amount, phoneNumber 
        });

        if (apiResponse.data.success) {
            newTransaction.status = 'Successful'
            await newTransaction.save();

            //To credit the user's account
             const user = await User.findById(userId);
             if(user) {
                user.balance += apiResponse.data.convertedAmount;
                await user.save();
                return res.status(200).json({ message: 'Airtime converted successfully', balance: user.balance });
             } else {
                return res.status(200).json({ message: 'User not found'});
            }
        } else {
            newTransaction.status = 'Pending';
            await newTransaction.save();
            return res.status(400).json({ message: 'Failed to convert to cash' });
        }
    } catch (error) {
        console.error('Error converting airtime:', error);
        return res.status(500).json({ message: 'Error converting to cash' });
    }
}

export async function getAllTransactions(req: Request, res: Response) {
    try {
        const transactions = await Transaction.find().populate('userId', 'email');
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Unable to fetch transactions' })
    }
}