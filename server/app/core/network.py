import torch
import torch.nn as nn
import torch.nn.functional as F

audio_len = 16_000  # kept for completeness


class ResBlock(nn.Module):
    def __init__(self, ch: int):
        super().__init__()
        self.block = nn.Sequential(          # ← back to `.block`
            nn.Conv1d(ch, ch, 3, padding=1),
            nn.BatchNorm1d(ch),
            nn.ReLU(),
            nn.Conv1d(ch, ch, 3, padding=1),
            nn.BatchNorm1d(ch),
        )
        self.act = nn.ReLU()

    def forward(self, x):
        return self.act(x + self.block(x))



class Generator(nn.Module):
    def __init__(self, message_bits: int = 16):
        super().__init__()
        self.message_bits = message_bits
        self.encoder = nn.Sequential(
            nn.Conv1d(1, 64, 7, padding=3),
            ResBlock(64), ResBlock(64)
        )
        self.lstm = nn.LSTM(64, 64, batch_first=True)
        self.embedding = (
            nn.Embedding(2 ** message_bits, 64) if message_bits > 0 else None
        )
        self.decoder = nn.Sequential(
            nn.ConvTranspose1d(64, 64, 7, padding=3),
            ResBlock(64),
            nn.Conv1d(64, 1, 1)
        )

    def forward(self, s, message=None):
        x = self.encoder(s)
        x = x.permute(0, 2, 1)
        x, _ = self.lstm(x)
        x = x.permute(0, 2, 1)
        if self.embedding is not None and message is not None:
            emb = self.embedding(message).unsqueeze(-1)
            x = x + emb.expand_as(x)
        return self.decoder(x)


class Detector(nn.Module):
    def __init__(self, message_bits: int = 16):
        super().__init__()
        out_dim = 1 + message_bits
        self.model = nn.Sequential(
            nn.Conv1d(1, 64, 7, padding=3),
            ResBlock(64), ResBlock(64),
            nn.Conv1d(64, out_dim, 1)
        )

    def forward(self, x):
        return self.model(x).permute(0, 2, 1)  # (B,T,C)
